import { Vector3, WebXRCamera, WebXRDefaultExperience, WebXRState } from "@babylonjs/core";

interface IState {
    currentState: string;
    xr?: WebXRDefaultExperience;
    levelNumber: number;
    newGame: boolean;
    attempts: number;
    actions: string[];
}

const initialState: IState = {
    currentState: "site",
    levelNumber: 0,
    newGame: true,
    attempts: 0,
    actions: [],
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

type NewBallEvent = {
    name: "NewBallEvent";
};

type TEvent = ChangeXRStateEvent | BallInBucketEvent | InvokeNextLevelEvent | NewBallEvent;
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
                actions: ["update_bucket", "update_text"],
                currentState: "welcome",
                xr: event.xr,
            };
        }
    }

    if (event.name === "ChangeXRStateEvent" && event.xr.baseExperience.state === WebXRState.NOT_IN_XR) {
        // TODO: reset camera to site view
        return {
            ...state,
            actions: [],
            currentState: "site",
            xr: undefined,
        };
    }

    if (state.currentState === "welcome") {
        if (event.name === "BallInBucketEvent") {
            return {
                ...state,
                actions: ["update_bucket"],
                currentState: "level",
                levelNumber: 1,
                attempts: 0,
            };
        }
    }

    if (state.currentState === "level") {
        if (event.name === "NewBallEvent") {
            return {
                ...state,
                actions: [],
                attempts: state.attempts + 1,
            };
        }
        if (event.name === "BallInBucketEvent") {
            return {
                ...state,
                actions: [],
                currentState: "win",
            };
        }
    }

    if (state.currentState === "win") {
        if (event.name === "InvokeNextLevelEvent") {
            if (state.levelNumber >= 3) {
                // end of game!
                return {
                    ...state,
                    actions: ["update_bucket", "update_text"],
                    currentState: "welcome",
                    levelNumber: 0,
                    newGame: false,
                };
            }

            return {
                ...state,
                actions: ["update_bucket"],
                currentState: "level",
                levelNumber: state.levelNumber + 1,
            };
        }
    }

    console.log("unprocessed event", state, event);
    return {
        ...state,
        actions: [],
    };
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
