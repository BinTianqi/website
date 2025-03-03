import "./index.css"
import "./checkbox.css"
export class SvgIconButton extends HTMLButtonElement {
    constructor() {
        super()
    }
    connectedCallback() {
        fetch(this.getAttribute("src"))
            .then(response => response.text())
            .then(svgText => {
                this.innerHTML = svgText
            })
            .catch(err => console.error(err))
    }
}

