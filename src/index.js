import { Component, createRef } from "react";
import { createRoot } from "react-dom/client";

import "./style.scss";

class App extends Component {

    constructor(props) {

        super(props);

        this.initialized = false;
        this.leveling = false;

        this.firstInputGainRef = createRef();
        this.firstOutputGainRef = createRef();

        this.state = {
            inputs: [],
            outputs: [],
            inputsGainWidth: 0,
            inputsGainHeight: 0,
            outputsGainWidth: 0,
            outputsGainHeight: 0
        };
    }

    componentDidMount() {

        window.addEventListener("resize", this.updateSliderSizes.bind(this));

        window.api.on("config", this.onApiConfig.bind(this));
        window.api.on("levels", this.onApiLevels.bind(this));
        window.api.send("loaded");
    }

    onApiConfig(event) {

        this.setState({ inputs: event.inputs, outputs: event.outputs }, () => {
            this.initialized = true;
            setTimeout(() => this.updateSliderSizes(), 10);
        });
    }

    onApiLevels(event) {

        if (!this.initialized || this.leveling) return;

        this.leveling = true;

        const calculateLevel = (level) => {
            level = level > 1e-5 ? (20 * Math.log10(level)) : -100;
            level = ((level - -80) * 100) / (12 - -80);
            level = Math.round(level * 100) / 100;
            if (level < 0) level = 0;
            if (level > 100) level = 100;
            return level;
        }

        this.setState({
            inputs: this.state.inputs.map((input, i) => ({
                ...input,
                leftLevel: calculateLevel(event.inputs[i].levelLeft),
                rightLevel: calculateLevel(event.inputs[i].levelRight)
            })),
            outputs: this.state.outputs.map((output, i) => ({
                ...output,
                leftLevel: calculateLevel(event.outputs[i].levelLeft),
                rightLevel: calculateLevel(event.outputs[i].levelRight)
            }))
        }, () => this.leveling = false);
    }

    updateSliderSizes() {

        if (!this.initialized) return;

        this.setState({
            inputsGainWidth: this.firstInputGainRef.current.clientHeight,
            inputsGainHeight: this.firstInputGainRef.current.clientWidth,
            outputsGainWidth: this.firstOutputGainRef.current.clientHeight,
            outputsGainHeight: this.firstOutputGainRef.current.clientWidth
        });
    }

    render() {

        const setInputGain = (id, gain) => {
            if (gain < -60) gain = -60;
            if (gain > 12) gain = 12;
            window.api.send("config", { inputs: [{ id, gain }] })
        }

        const setOutputGain = (id, gain) => {
            if (gain < -60) gain = -60;
            if (gain > 12) gain = 12;
            window.api.send("config", { outputs: [{ id, gain }] })
        }

        return <>

            <div className="inputs">
                {this.state.inputs.map((input) => <div key={input.id} className="input">
                    <div className="label">{input.label}</div>
                    <div className="column">
                        <div className={input.mute ? "level muted" : "level"}>
                            <div><div style={{ height: (input.leftLevel || 0) + "%" }} /></div>
                            <div><div style={{ height: (input.rightLevel || 0) + "%" }} /></div>
                        </div>
                        <div className="gain" ref={input.id === 0 ? this.firstInputGainRef : undefined}>
                            <input type="range" min={-60} max={12} step={0.1} value={input.gain}
                                style={{ width: this.state.inputsGainWidth + "px", height: this.state.inputsGainHeight + "px" }}
                                onInput={(event) => setInputGain(input.id, parseFloat(event.target.value))}
                                onDoubleClick={() => setInputGain(input.id, 0)}
                                onWheel={(event) => setInputGain(input.id, input.gain + (event.deltaY < 0 ? 3 : -3))} />
                        </div>
                        <div className="buttons">
                            <div className="gain-value">{Math.round(input.gain * 10) / 10}dB</div>
                            {input.outputs.map((output) => <button key={output.id} className={output.enabled ? "active" : ""}
                                onClick={() => window.api.send("config", { inputs: [{ id: input.id, outputs: [{ id: output.id, enabled: !output.enabled }] }] })}>
                                {output.name}
                            </button>)}
                            <button className={input.mute ? "mute active" : "mute"}
                                onClick={() => window.api.send("config", { inputs: [{ id: input.id, mute: !input.mute }] })}>Mute</button>
                        </div>
                    </div>
                </div>)}
            </div>

            <div className="outputs">
                {this.state.outputs.map((output) => <div key={output.id} className="output">
                    <div className="label">{output.label}</div>
                    <div className="column">
                        <div className={output.mute ? "level muted" : "level"}>
                            <div><div style={{ height: (output.leftLevel || 0) + "%" }} /></div>
                            <div><div style={{ height: (output.rightLevel || 0) + "%" }} /></div>
                        </div>
                        <div className="gain" ref={output.id === 0 ? this.firstOutputGainRef : undefined}>
                            <input type="range" min={-60} max={12} step={0.1} value={output.gain}
                                style={{ width: this.state.outputsGainWidth + "px", height: this.state.outputsGainHeight + "px" }}
                                onInput={(event) => setOutputGain(output.id, parseFloat(event.target.value))}
                                onDoubleClick={() => setOutputGain(output.id, 0)}
                                onWheel={(event) => setOutputGain(output.id, output.gain + (event.deltaY < 0 ? 3 : -3))} />
                        </div>
                        <div className="buttons">
                            <div className="gain-value">{Math.round(output.gain * 10) / 10}dB</div>
                            <button className={output.mute ? "mute active" : "mute"}
                                onClick={() => window.api.send("config", { outputs: [{ id: output.id, mute: !output.mute }] })}>Mute</button>
                        </div>
                    </div>
                </div>)}
            </div>

        </>;
    }
}

createRoot(document.getElementById("root")).render(<App />);
