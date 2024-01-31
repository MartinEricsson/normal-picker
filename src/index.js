const style = `
    .color-picker {
        width: 150px;
        height: 16px;
        background-color: #000000;
        border-color: rgba(0,0,0,0.5);
        border-width: 1px;
        border-style: solid;
        border-radius: 2px;
        margin: 10px;
    }
    .container {
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #FFFFFF;
        padding: 10px;
        margin: 10px;
        width: 150px;
    }
    canvas {
        width: 150px;
        height: 150px;
        background-color: #ffffff;
        margin: 0px 10px;
    }
    .viz-div {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    #theta-range, #phi-range{
        width: 150px;
        margin: 10px;
    }

    label {
        font-size: 0.8rem;
    }

    /*********** Baseline, reset styles ***********/
    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        width: 25rem;
    }

    /* Removes default focus */
        input[type="range"]:focus {
        outline: none;
    }

    /******** Chrome, Safari, Opera and Edge Chromium styles ********/
    /* slider track */
    input[type="range"]::-webkit-slider-runnable-track {
        background-color: #c9c9c9;
        border-radius: 0.5rem;
        height: 0.5rem;
    }

    /* slider thumb */
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        margin-top: -4px; /* Centers thumb on the track */
        background-color: #808080;
        border-radius: 0.5rem;
        height: 1rem;
        width: 1rem;
    }

    input[type="range"]:focus::-webkit-slider-thumb {
        outline: 3px solid #808080;
        outline-offset: 0.125rem;
    }

    /*********** Firefox styles ***********/
    /* slider track */
    input[type="range"]::-moz-range-track {
        background-color: #c9c9c9;
        border-radius: 0.5rem;
        height: 0.5rem;
    }

    /* slider thumb */
    input[type="range"]::-moz-range-thumb {
        background-color: #808080;
        border: none; /*Removes extra border that FF applies*/
        border-radius: 0.5rem;
        height: 1rem;
        width: 1rem;
    }

    input[type="range"]:focus::-moz-range-thumb{
        outline: 3px solid #808080;
        outline-offset: 0.125rem;
    }
`;

class NormalPicker extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.ctx = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="container">
                <canvas id="screen" width="150" height="150"></canvas>
                <div class="color-picker"></div>
                <label for="theta-range">Theta:</label>
                <input type="range" id="theta-range" min="0" max="360" value="0" class="theta-range">
                <label for="phi-range">Phi:</label>
                <input type="range" id="phi-range" min="0" max="360" value="180" class="phi-range">
            </div>
        `;

        this.shadowRoot.querySelector('.theta-range').addEventListener('input', ({ target }) => {
            this.update();
            this.shadowRoot.querySelector('label[for="theta-range"]').textContent = `Theta: ${target.value}`;
        });
        this.shadowRoot.querySelector('.phi-range').addEventListener('input', ({ target }) => {
            this.update();
            this.shadowRoot.querySelector('label[for="phi-range"]').textContent = `Phi: ${target.value}`;
        });

        this.shadowRoot.querySelector('label[for="theta-range"]').textContent = `Theta: ${this.shadowRoot.querySelector('.theta-range').value}`;
        this.shadowRoot.querySelector('label[for="phi-range"]').textContent = `Phi: ${this.shadowRoot.querySelector('.phi-range').value}`;

        this.ctx = this.shadowRoot.getElementById('screen').getContext('2d');
        this.update();
    }

    update() {
        const color = this.getColorFromNormal();
        this.shadowRoot.querySelector('.color-picker').style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.setAttribute('value', `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`);

        const customEvent = new CustomEvent('colorChange', {
            detail: { color: color }
        });

        this.dispatchEvent(customEvent);

        this.draw();
    }

    draw() {
        // clear the screen
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, 150, 150);

        // draw helpers
        this.ctx.fillStyle = `rgb(128,128,128)`;
        for (let i = 0; i < 50; i++) {
            let x = Math.cos(i * 2 * Math.PI / 50);
            let y = Math.sin(i * 2 * Math.PI / 50);
            this.drawPoint(x, y, 0);
        }
        for (let i = 0; i < 50; i++) {
            let x = Math.cos(i * 2 * Math.PI / 50);
            let z = Math.sin(i * 2 * Math.PI / 50);
            this.drawPoint(x, 0, z);
        }

        // draw coordinates axis
        this.ctx.strokeStyle = `rgb(128,128,128)`;
        this.drawVector(1, 0, 0);
        this.drawVector(0, -1, 0);
        this.drawVector(0, 0, 1);

        // draw the normal
        const color = this.getColorFromNormal();
        this.ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        const n = this.getNormal();
        this.drawVector(n.x, n.y, n.z);
    }

    project(x, y, z) {
        const scale = 75;
        const distance = 8;
        const c = Math.cos(Math.PI / 6);
        const s = Math.sin(Math.PI / 6);

        const rotationZ = y * s + (z * c + x * s) * c;

        return {
            x: (x * c - z * s) * (distance / (rotationZ + distance)) * scale + scale,
            y: (y * c - (z * c + x * s) * s) * (distance / (rotationZ + distance)) * scale + scale
        };
    }

    drawVector(x, y, z) {
        const { x: px, y: py } = this.project(0, 0, 0);
        const { x: qx, y: qy } = this.project(x, -z, y);

        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        this.ctx.lineTo(qx, qy);
        this.ctx.stroke();
    }

    drawPoint(x, y, z) {
        const { x: px, y: py } = this.project(x, y, z);
        this.ctx.fillRect(px, py, 1, 1);
    }

    getNormal() {
        const t = this.shadowRoot.querySelector('.theta-range').value * (Math.PI / 180);
        const p = this.shadowRoot.querySelector('.phi-range').value * (Math.PI / 180);

        return {
            x: Math.sin(t) * Math.cos(p),
            y: Math.sin(t) * Math.sin(p),
            z: Math.cos(t)
        };
    }

    getColorFromNormal() {
        const normal = this.getNormal();

        return {
            r: ((normal.x + 1) * 127.5) | 0,
            g: ((normal.y + 1) * 127.5) | 0,
            b: ((normal.z + 1) * 127.5) | 0
        };
    }
}

customElements.define('normal-picker', NormalPicker);
