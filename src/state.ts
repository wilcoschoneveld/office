import { WebXRCamera, WebXRDefaultExperience, WebXRState } from "@babylonjs/core";

interface IState {
    currentState: string;
    xr?: WebXRDefaultExperience;
}

const initialState: IState = {
    currentState: "sandbox",
};

type ChangeXRState = {
    name: "ChangeXRState";
    xr: WebXRDefaultExperience;
};

type TEvent = ChangeXRState;
type TSubscriber = (state: IState) => void;

export interface IMachine {
    send: (event: TEvent) => void;
    subscribe: (subscriber: TSubscriber) => void;
}

const transition = (state: IState, event: TEvent): IState => {
    if (event.name === "ChangeXRState") {
        return {
            ...state,
            xr: event.xr,
        };
    }

    console.log("unprocessed event", state, event);
    return state;
};

const invoke = async (state: IState, event: TEvent, send: (event: TEvent) => void) => {};

export const createMachine = (): IMachine => {
    let state = initialState;
    const subscribers: Array<TSubscriber> = [];

    const send = (event: TEvent) => {
        const newState = transition(state, event);

        if (newState === state) {
            return;
        }

        console.log("state transition", state, event, newState);

        state = newState;

        for (const subscriber of subscribers) {
            subscriber(state);
        }

        invoke(state, event, send);
    };

    const subscribe = (subscriber: TSubscriber) => {
        subscribers.push(subscriber);

        subscriber(state);

        return () => {
            const index = subscribers.indexOf(subscriber);
            subscribers.splice(index, 1);
        };
    };

    return {
        send,
        subscribe,
    };
};
