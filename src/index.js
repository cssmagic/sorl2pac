import { generatePac } from "./codegen.js";
import { parseSorl } from "./parser.js";

export function sorl2pac(sorl, results) {
	validateInput(sorl, results);
	return generatePac(parseSorl(sorl), results);
}

function validateInput(sorl, results) {
	if (typeof sorl !== "string") {
		throw new TypeError("sorl must be a string");
	}

	if (results === null || typeof results !== "object") {
		throw new TypeError("results must be an object");
	}

	if (typeof results.matched !== "string") {
		throw new TypeError("results.matched must be a string");
	}

	if (typeof results.unmatched !== "string") {
		throw new TypeError("results.unmatched must be a string");
	}
}
