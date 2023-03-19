export class AuthErrorResponse extends Response {
	constructor() {
		const jsonBody = JSON.stringify({
			errors: [
				{
					code: 'UNAUTHORIZED',
					message: 'authentication required',
					detail: null,
				},
			],
		});
		const init = {
			status: 401,
			headers: {
				'content-type': 'application/json;charset=UTF-8',
				'WWW-Authenticate': 'Basic realm="registry.maximoguk.com"',
			},
		};
		super(jsonBody, init);
	}
}
