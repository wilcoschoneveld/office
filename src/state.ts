import { Vector3, WebXRCamera, WebXRDefaultExperience, WebXRState } from "@babylonjs/core";

interface IState {
    currentState: string;
    xr?: WebXRDefaultExperience;
    levelNumber: number;
}

const initialState: IState = {
    currentState: "site",
    levelNumber: 0,
};

type ChangeXRStateEvent = {
    name: "ChangeXRStateEvent";
    xr: WebXRDefaultExperience;
};

type BallInBucketEvent = {
    name: "BallInBucketEvent";
};

type InvokeNextLevelEvent = {
    name: "InvokeNextLevelEvent";
};

type TEvent = ChangeXRStateEvent | BallInBucketEvent | InvokeNextLevelEvent;
type TSubscriber = (state: IState) => void;

export interface IMachine {
    send: (event: TEvent) => void;
    subscribe: (subscriber: TSubscriber) => void;
}

const transition = (state: IState, event: TEvent): IState => {
    if (state.currentState === "site") {
        if (event.name === "ChangeXRStateEvent" && event.xr.baseExperience.state === WebXRState.IN_XR) {
            return {
                ...state,
                currentState: "welcome",
                xr: event.xr,
            };
        }
    }

    if (event.name === "ChangeXRStateEvent" && event.xr.baseExperience.state === WebXRState.NOT_IN_XR) {
        // TODO: reset camera to site view
        return {
            ...state,
            currentState: "site",
            xr: undefined,
        };
    }

    if (state.currentState === "welcome") {
        if (event.name === "BallInBucketEvent") {
            return {
                ...state,
                currentState: "level",
                levelNumber: 1,
            };
        }
    }

    if (state.currentState === "level") {
        if (event.name === "BallInBucketEvent") {
            return {
                ...state,
                currentState: "win",
            };
        }
    }

    if (state.currentState === "win") {
        if (event.name === "InvokeNextLevelEvent") {
            return {
                ...state,
                currentState: "level",
                levelNumber: state.levelNumber + 1,
            };
        }
    }

    console.log("unprocessed event", state, event);
    return state;
};

const invoke = async (state: IState, event: TEvent, send: (event: TEvent) => void) => {
    if (state.currentState === "win") {
        setTimeout(() => {
            send({ name: "InvokeNextLevelEvent" });
        }, 3000);
    }
};

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
