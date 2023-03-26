import { Router } from 'itty-router';

interface Env {
	REGISTRY: R2Bucket;
}

function hexToDigest(sha256: ArrayBuffer) {
	const digest = [...new Uint8Array(sha256)]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `sha256:${digest}`;
}

const v2Router = Router({ base: '/v2/' });

v2Router.get('/', () => new Response());

// v2Router.get('/:name/tags/list', async (req, env: Env) => {
// 	const { name } = req.params;
// 	const res = await env.REGISTRY.get(`${name}/tags/list`);
// 	if (res) {
// 		const body = await res.text();
// 		return new JsonResponse(body);
// 	}
// });

v2Router.head('/:name/manifests/:reference', async (req, env: Env) => {
	const { name, reference } = req.params;

	const res = await env.REGISTRY.head(`${name}/manifests/${reference}`);

	if (!res) {
		return new Response('Manifest not found', { status: 404 });
	}

	const digestHeader: Record<string, string> = {};

	if (res.checksums.sha256 != null) {
		digestHeader['Docker-Content-Digest'] = hexToDigest(res.checksums.sha256!);
	}

	return new Response(null, {
		headers: {
			'Content-Length': res.size.toString(),
			'Content-Type': res.httpMetadata!.contentType!,
			...digestHeader,
		},
	});
});

v2Router.get('/:name/manifests/:reference', async (req, env: Env) => {
	const { name, reference } = req.params;
	const res = await env.REGISTRY.get(`${name}/manifests/${reference}`);

	if (!res) {
		return new Response('Manifest not found', { status: 404 });
	}

	const digestHeader: Record<string, string> = {};

	if (res.checksums.sha256 != null) {
		digestHeader['Docker-Content-Digest'] = hexToDigest(res.checksums.sha256!);
	}

	return new Response(res.body, {
		headers: {
			'Content-Length': res.size.toString(),
			'Content-Type': res.httpMetadata!.contentType!,
			...digestHeader,
		},
	});
});

v2Router.put('/:name/manifests/:reference', async (req, env: Env) => {
	const { name, reference } = req.params;

	const sha256 = new crypto.DigestStream('SHA-256');
	const uuid = crypto.randomUUID();

	await env.REGISTRY.put(uuid, req.body);
	const res = await env.REGISTRY.get(uuid);

	await res!.body.pipeTo(sha256);

	const digest = await sha256.digest;
	const digestStr = hexToDigest(digest);

	const res2 = await env.REGISTRY.get(uuid);
	await env.REGISTRY.put(`${name}/manifests/${reference}`, res2!.body, {
		sha256: digest,
		httpMetadata: {
			contentType: req.headers.get('Content-Type'),
		},
	});
	const res3 = await env.REGISTRY.get(uuid);
	await env.REGISTRY.put(`${name}/manifests/${digestStr}`, res3!.body, {
		sha256: digest,
		httpMetadata: {
			contentType: req.headers.get('Content-Type'),
		},
	});
	await env.REGISTRY.delete(uuid);

	return new Response(null, {
		headers: {
			Location: `/v2/${name}/manifests/${reference}`,
			'Docker-Content-Digest': hexToDigest(digest),
		},
	});
});

// v2Router.delete('/:name/manifests/:reference', async (req, env: Env) => {
// 	const { name, reference } = req.params;
// 	await env.REGISTRY.delete(`${name}/manifests/${reference}`);

// 	return new Response();
// });

v2Router.get('/:name/blobs/:digest', async (req, env: Env) => {
	const { name, digest } = req.params;
	const res = await env.REGISTRY.get(`${name}/blobs/${digest}`);

	if (!res) {
		return new Response('Blob not found', { status: 404 });
	}

	const digestHeader: Record<string, string> = {};
	if (res.checksums.sha256 != null) {
		digestHeader['Docker-Content-Digest'] = hexToDigest(res.checksums.sha256!);
	}

	return new Response(res.body, {
		headers: { 'Content-Length': res.size.toString(), ...digestHeader },
	});
});

// v2Router.delete('/:name/blobs/:digest', async (req, env: Env) => {
// 	const { name, digest } = req.params;
// 	await env.REGISTRY.delete(`${name}/blobs/${digest}`);

// 	return new Response();
// });

v2Router.post('/:name/blobs/uploads/', async (req, env: Env) => {
	const { name } = req.params;

	// Generate a unique ID for this upload
	const uuid = crypto.randomUUID();

	const upload = await env.REGISTRY.createMultipartUpload(uuid);
	const state = { uploadId: upload.uploadId, parts: [] };
	const stateStr = encodeURIComponent(JSON.stringify(state));

	// Return a res with a Location header indicating where to send the data to complete the upload
	return new Response(null, {
		status: 202,
		headers: {
			'Content-Length': '0',
			'Content-Range': '0-0',
			Range: '0-0',
			Location: `/v2/${name}/blobs/uploads/${uuid}?_state=${stateStr}`,
			'Docker-Upload-UUID': uuid,
		},
	});
});

v2Router.patch('/:name/blobs/uploads/:uuid', async (req, env: Env) => {
	const { name, uuid } = req.params;

	const state = JSON.parse(req.query._state as string);

	// Use the r2 bindings to store the chunk data in Workers KV
	const upload = env.REGISTRY.resumeMultipartUpload(`${uuid}`, state.uploadId);

	const [body1, body2] = req.body.tee();

	const uploadTask = upload.uploadPart(state.parts.length + 1, body2);

	let bodySize = 0;
	const body1Reader = body1.getReader();
	while (true) {
		const { done, value } = await body1Reader.read();
		if (done) {
			break;
		}
		bodySize += value.length;
	}

	const res = await uploadTask;
	state.parts.push(res);
	const stateStr = encodeURIComponent(JSON.stringify(state));

	// Return a res indicating that the chunk was successfully uploaded
	return new Response(null, {
		status: 202,
		headers: {
			Location: `/v2/${name}/blobs/uploads/${uuid}?_state=${stateStr}`,
			Range: `0-${bodySize}`,
			'Docker-Upload-UUID': uuid,
		},
	});
});

v2Router.put('/:name/blobs/uploads/:uuid', async (req, env: Env) => {
	const { name, uuid } = req.params;
	const { _state, digest } = req.query;
	const state = JSON.parse(_state as string);

	if (state.parts.length === 0) {
		await env.REGISTRY.put(`${name}/blobs/${digest}`, req.body, {
			sha256: (digest as string).slice(7),
		});
	} else {
		const upload = env.REGISTRY.resumeMultipartUpload(uuid, state.uploadId);
		await upload.complete(state.parts);
		const obj = await env.REGISTRY.get(uuid);

		await env.REGISTRY.put(`${name}/blobs/${digest}`, obj!.body, {
			sha256: (digest as string).slice(7),
		});

		await env.REGISTRY.delete(uuid);
	}

	return new Response(null, {
		status: 201,
		headers: {
			'Content-Length': '0',
			'Docker-Content-Digest': `${digest}`,
			Location: `/v2/${name}/blobs/${digest}`,
		},
	});
});

v2Router.head('/:name/blobs/:digest', async (req, env: Env) => {
	const { name, digest } = req.params;

	const res = await env.REGISTRY.head(`${name}/blobs/${digest}`);

	if (!res) {
		return new Response('Blob not found', { status: 404 });
	}

	const digestHeader: Record<string, string> = {};
	if (res.checksums.sha256 != null) {
		digestHeader['Docker-Content-Digest'] = hexToDigest(res.checksums.sha256!);
	}

	return new Response(null, {
		headers: {
			'Content-Length': res.size.toString(),
			...digestHeader,
		},
	});
});

// v2Router.delete('/:name/blobs/uploads/:uuid', async (req, env: Env) => {
// 	const { name, uuid } = req.params;
// 	await env.REGISTRY.delete(`${name}/blobs/uploads/${uuid}`);

// 	return new Response();
// });

// v2Router.get('/_catalog', () => new Response('Catalog WIP'));

export default v2Router;
