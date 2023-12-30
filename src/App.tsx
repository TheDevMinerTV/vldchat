import { For, Show, createSignal, onCleanup } from "solid-js";
import "./App.css";
import {
	VeilidRoutingContext,
	VeilidStateNetwork,
	veilidClient,
} from "./pkg/veilid_wasm";
import { VEILID_CORE_CONFIG, VEILID_WASM_CONFIG } from "./veilid";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type Message = {
	sender: string | null;
	content: string;
};

function App() {
	const [connected, setConnected] = createSignal(false);
	const [ready, setReady] = createSignal(false);
	const [nodeId, setNodeId] = createSignal<string | null>(null);
	const [network, setNetwork] = createSignal<VeilidStateNetwork | null>(null);
	const [sending, setSending] = createSignal(false);

	let ctx: VeilidRoutingContext | null = null;

	const [targetNodeId, setTargetNodeId] = createSignal<string>("");
	const [input, setInput] = createSignal<string>("");
	const [messages, setMessages] = createSignal<Message[]>([]);

	const connect = async () => {
		if (connected()) await disconnect();

		await veilidClient.initializeCore(VEILID_WASM_CONFIG);
		await veilidClient.startupCore((update) => {
			switch (update.kind) {
				case "Network":
					setNetwork(update);
					break;

				case "AppMessage":
					try {
						const raw = decoder.decode(update.message);
						const msg = JSON.parse(raw) as Message;

						setMessages((messages) => [...messages, msg]);
					} catch (error) {
						console.error(error);
					}
					break;

				case "Attachment":
					setReady(update.public_internet_ready);
					break;

				case "Log":
					return;
			}

			console.log(update);
		}, JSON.stringify(VEILID_CORE_CONFIG));

		const state = await veilidClient.getState();
		const id = state.config.config.network.routing_table.node_id[0].toString();
		setNodeId(id);

		await veilidClient.attach();

		ctx = VeilidRoutingContext.create().withSafety({
			Safe: {
				stability: "Reliable",
				hop_count: 4,
				sequencing: "EnsureOrdered",
			},
		});
		ctx;

		setConnected(true);
	};

	const disconnect = async () => {
		if (!connected()) return;

		await veilidClient.detach();
		await veilidClient.shutdownCore();

		setConnected(false);
	};

	onCleanup(disconnect);

	return (
		<div style={{}}>
			<div style={{ display: "flex", gap: "1rem", "align-items": "center" }}>
				<span>{connected() ? "Connected" : "Disconnected"}</span>
				<button onClick={connected() ? disconnect : connect}>
					{connected() ? "Disconnect" : "Connect"}
				</button>
			</div>
			<div>
				<Show when={nodeId()}>
					{(nodeId) => (
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								"align-items": "center",
							}}
						>
							<p>Node ID: {nodeId()}</p>
							<button
								class="square"
								onClick={() => navigator.clipboard.writeText(nodeId())}
							>
								📋
							</button>
						</div>
					)}
				</Show>

				<Show when={network()}>
					{(network) => (
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								"align-items": "center",
							}}
						>
							<p style={{ flex: "1" }}>{network().bps_down} bytes/s down</p>
							<p style={{ flex: "1" }}>{network().bps_up} bytes/s up</p>
							<p style={{ flex: "1" }}>{network().peers.length} peers</p>

							{/* <pre>{JSON.stringify(network(), null, 2)}</pre> */}
						</div>
					)}
				</Show>
			</div>
			<Show when={connected()}>
				<div>
					<form
						onsubmit={async (e) => {
							e.preventDefault();

							if (!targetNodeId() || !input() || !ctx || !ready() || sending())
								return;

							setSending(true);
							try {
								await ctx.appMessage(
									targetNodeId(),
									encoder.encode(
										JSON.stringify({ sender: nodeId()!, content: input() })
									)
								);
							} finally {
								setSending(false);
							}

							setInput("");
						}}
					>
						<input
							type="text"
							value={targetNodeId()}
							onInput={(e) => setTargetNodeId(e.currentTarget.value)}
							placeholder="Target Node ID"
							disabled={!ready() || sending()}
						/>
						<input
							type="text"
							value={input()}
							onInput={(e) => setInput(e.currentTarget.value)}
							placeholder="Content"
							disabled={!ready() || sending()}
						/>

						<button type="submit">Send</button>
					</form>
				</div>
			</Show>
			<div>
				<For each={messages()}>
					{(msg) => (
						<p>
							{msg.sender ?? "Unknown"}: {msg.content}
						</p>
					)}
				</For>
			</div>
		</div>
	);
}

export default App;
