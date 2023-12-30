import { Accessor, For } from "solid-js";
import { Message } from "../lib/types";

export const Conversation = ({
	conversation,
}: {
	conversation: Accessor<Message[]>;
}) => {
	return (
		<For each={conversation()}>
			{(msg) => (
				<div>
					{msg.fromUs ? "⬅️" : "➡️"}: {msg.content}
				</div>
			)}
		</For>
	);
};
