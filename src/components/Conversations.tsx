import { Accessor, For, Show, Signal, createSignal } from "solid-js";
import { Message } from "../lib/types";
import { Conversation } from "./Conversation";

export const Conversations = ({
	conversations,
}: {
	conversations: Accessor<Map<string, Signal<Message[]>>>;
}) => {
	const [selectedChat, setSelectedChat] = createSignal<string | null>(null);

	return (
		<div style={{ "margin-top": "1rem" }}>
			<For each={[...conversations().keys()]}>
				{(sender) => (
					<button
						style={{ width: "100%" }}
						onClick={() =>
							setSelectedChat(selectedChat() === sender ? null : sender)
						}
					>
						{sender}
					</button>
				)}
			</For>

			<Show when={selectedChat()}>
				{(selectedChat) => {
					const sender = selectedChat();

					const [conversation] = conversations().get(sender)!;

					return (
						<>
							<p>Chat with {sender}</p>
							<Conversation conversation={conversation} />
						</>
					);
				}}
			</Show>
		</div>
	);
};
