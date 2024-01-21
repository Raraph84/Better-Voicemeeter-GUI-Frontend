import { Component, createRef } from "react";
import { createRoot } from "react-dom/client";

import "./style.scss";

class App extends Component {

    constructor(props) {

        super(props);

        this.leveling = false;

        this.state = { inputs: [], outputs: [] };
    }

    componentDidMount() {

        window.api.on("config", this.onApiConfig.bind(this));
        window.api.on("levels", this.onApiLevels.bind(this));
        window.api.send("loaded");
    }

    onApiConfig(event) {

        this.setState({ inputs: event.inputs, outputs: event.outputs });
    }

    onApiLevels(event) {

        if (this.leveling) return;

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

    render() {

        return <>

            <div className="inputs">
                {this.state.inputs.map((input) => <Input key={input.id} input={input} />)}
            </div>

            <div className="outputs">
                {this.state.outputs.map((output) => <Output key={output.id} output={output} />)}
            </div>

        </>;
    }
}

class Input extends Component {

    constructor(props) {

        super(props);

        this.gainRef = createRef();

        this.state = { gainWidth: 0, gainHeight: 0, editingLabel: false };
    }

    componentDidMount() {

        setTimeout(() => this.updateSliderSizes(), 100);

        window.addEventListener("resize", this.updateSliderSizes.bind(this));
    }

    updateSliderSizes() {

        this.setState({
            gainWidth: this.gainRef.current.clientHeight,
            gainHeight: this.gainRef.current.clientWidth
        });
    }

    render() {

        const setInputGain = (id, gain) => {
            if (gain < -60) gain = -60;
            if (gain > 12) gain = 12;
            window.api.send("config", { inputs: [{ id, gain }] })
        }

        return <div className="input">
            {!this.state.editingLabel
                ? <div className="label" onClick={() => this.setState({ editingLabel: true })}>{this.props.input.label || "Unnamed"}</div>
                : <input className="label" defaultValue={this.props.input.label} autoFocus
                    onKeyDown={(event) => { if (event.key === "Enter") { window.api.send("config", { inputs: [{ id: this.props.input.id, label: event.target.value }] }); this.setState({ editingLabel: false }); } }} />}
            <div className="column">
                <div className={this.props.input.mute ? "level muted" : "level"}>
                    <div><div style={{ height: (this.props.input.leftLevel || 0) + "%" }} /></div>
                    <div><div style={{ height: (this.props.input.rightLevel || 0) + "%" }} /></div>
                </div>
                <div className="gain" ref={this.gainRef}>
                    <input type="range" min={-60} max={12} step={0.1} value={this.props.input.gain}
                        style={{ width: this.state.gainWidth + "px", height: this.state.gainHeight + "px" }}
                        onInput={(event) => setInputGain(this.props.input.id, parseFloat(event.target.value))}
                        onDoubleClick={() => setInputGain(this.props.input.id, 0)}
                        onWheel={(event) => setInputGain(this.props.input.id, this.props.input.gain + (event.deltaY < 0 ? 3 : -3))} />
                </div>
                <div className="buttons">
                    <div className="gain-value">{Math.round(this.props.input.gain * 10) / 10}dB</div>
                    {this.props.input.outputs.map((output) => <button key={output.id} className={output.enabled ? "active" : ""}
                        onClick={() => window.api.send("config", { inputs: [{ id: this.props.input.id, outputs: [{ id: output.id, enabled: !output.enabled }] }] })}>
                        {output.name}
                    </button>)}
                    <button className={this.props.input.mute ? "mute active" : "mute"}
                        onClick={() => window.api.send("config", { inputs: [{ id: this.props.input.id, mute: !this.props.input.mute }] })}>Mute</button>
                </div>
            </div>
        </div>;
    }
}

class Output extends Component {

    constructor(props) {

        super(props);

        this.gainRef = createRef();

        this.state = { gainWidth: 0, gainHeight: 0, editingLabel: false };
    }

    componentDidMount() {

        setTimeout(() => this.updateSliderSizes(), 100);

        window.addEventListener("resize", this.updateSliderSizes.bind(this));
    }

    updateSliderSizes() {

        this.setState({
            gainWidth: this.gainRef.current.clientHeight,
            gainHeight: this.gainRef.current.clientWidth
        });
    }

    render() {

        const setOutputGain = (id, gain) => {
            if (gain < -60) gain = -60;
            if (gain > 12) gain = 12;
            window.api.send("config", { outputs: [{ id, gain }] })
        }

        return <div className="output">
            {!this.state.editingLabel
                ? <div className="label" onClick={() => this.setState({ editingLabel: true })}>{this.props.output.label || "Unnamed"}</div>
                : <input className="label" defaultValue={this.props.output.label} autoFocus
                    onKeyDown={(event) => { if (event.key === "Enter") { window.api.send("config", { outputs: [{ id: this.props.output.id, label: event.target.value }] }); this.setState({ editingLabel: false }); } }} />}
            <div className="column">
                <div className={this.props.output.mute ? "level muted" : "level"}>
                    <div><div style={{ height: (this.props.output.leftLevel || 0) + "%" }} /></div>
                    <div><div style={{ height: (this.props.output.rightLevel || 0) + "%" }} /></div>
                </div>
                <div className="gain" ref={this.gainRef}>
                    <input type="range" min={-60} max={12} step={0.1} value={this.props.output.gain}
                        style={{ width: this.state.gainWidth + "px", height: this.state.gainHeight + "px" }}
                        onInput={(event) => setOutputGain(this.props.output.id, parseFloat(event.target.value))}
                        onDoubleClick={() => setOutputGain(this.props.output.id, 0)}
                        onWheel={(event) => setOutputGain(this.props.output.id, this.props.output.gain + (event.deltaY < 0 ? 3 : -3))} />
                </div>
                <div className="buttons">
                    <div className="gain-value">{Math.round(this.props.output.gain * 10) / 10}dB</div>
                    <button className={this.props.output.mute ? "mute active" : "mute"}
                        onClick={() => window.api.send("config", { outputs: [{ id: this.props.output.id, mute: !this.props.output.mute }] })}>Mute</button>
                </div>
            </div>
        </div>;
    }
}

createRoot(document.getElementById("root")).render(<App />);
