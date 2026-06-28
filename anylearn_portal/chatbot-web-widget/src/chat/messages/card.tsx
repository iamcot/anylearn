import { h, Component } from "preact";
import MessageType from "./messagetype";
import { IMessageTypeProps } from "../../typings";

export default class CardType extends MessageType {
    render(props: IMessageTypeProps) {
        const message = props.message;
        const textObject = { __html: message.text };

        return (
            <div>
                <div dangerouslySetInnerHTML={textObject} />
            </div>
        );
    }
}
