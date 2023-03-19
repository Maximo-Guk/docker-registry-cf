/**
 * The core server that runs on a Cloudflare worker.
 */

import { Router } from 'itty-router';
import { AuthErrorResponse } from './classes/ErrorResponse';
import v2API from './v2/v2Router';

interface Env {
	PROD: string;
	USER: string;
	PASS: string;
}

const router = Router();

/**
 * V2 Api
 */
router.all('/v2/*', v2API.handle);

router.all('*', () => new Response('Not Found.', { status: 404 }));

function verifyCredentials(user: string, pass: string, env: Env) {
	if (user === env.USER && pass === env.PASS) {
		return true;
	}
	return false;
}

function basicAuthentication(request: Request) {
	const authorization = request.headers.get('Authorization');

	if (!authorization) {
		return false;
	}

	const [scheme, encoded] = authorization.split(' ');

	// The Authorization header must start with Basic, followed by a space.
	if (!encoded || scheme !== 'Basic') {
		return false;
	}

	// Decodes the base64 value and performs unicode normalization.
	// @see https://datatracker.ietf.org/doc/html/rfc7613#section-3.3.2 (and #section-4.2.2)
	// @see https://dev.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	const buffer = Uint8Array.from(atob(encoded), (character) =>
		character.charCodeAt(0)
	);
	const decoded = new TextDecoder().decode(buffer).normalize();

	// The username & password are split by the first colon.
	//=> example: "username:password"
	const index = decoded.indexOf(':');

	// The user & password are split by the first colon and MUST NOT contain control characters.
	// @see https://tools.ietf.org/html/rfc5234#appendix-B.1 (=> "CTL = %x00-1F / %x7F")
	if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
		return false;
	}

	return {
		user: decoded.substring(0, index),
		pass: decoded.substring(index + 1),
	};
}

export default {
	/**
	 * Every request to a worker will start in the `fetch` method.
	 * Verify the signature with the request, and dispatch to the router.
	 * @param {*} request A Fetch Request object
	 * @param {*} env A map of key/value pairs with env vars and secrets from the cloudflare env.
	 * @returns
	 */
	async fetch(request: Request, env: Env) {
		const auth = basicAuthentication(request);
		if (!auth && env.PROD === 'true') {
			return new AuthErrorResponse();
		} else if (auth && env.PROD === 'true') {
			const verified = verifyCredentials(auth.user, auth.pass, env);
			if (!verified) {
				return new AuthErrorResponse();
			}
		}

		// Dispatch the request to the appropriate route
		return router.handle(request, env);
	},
};
