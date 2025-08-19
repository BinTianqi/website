import "./index.css"
import "./checkbox.css"
import "./buttons.css"
import Icons from "../icons"

export class IconButton extends HTMLButtonElement {
    constructor() {
        super()
    }
    connectedCallback() {
        this.innerHTML = Icons[this.getAttribute("icon")]
    }
}

export class SvgIcon extends HTMLElement {
    constructor() {
        super()
    }
    connectedCallback() {
        this.outerHTML = Icons[this.getAttribute("icon")]
    }
}

