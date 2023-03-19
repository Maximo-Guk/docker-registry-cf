import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

describe('Worker', () => {
	// GET	/v2/	Base	Check that the endpoint implements Docker Registry API V2.
	// GET	/v2/<name>/tags/list	Tags	Fetch the tags under the repository identified by name.
	// GET	/v2/<name>/manifests/<reference>	Manifest	Fetch the manifest identified by name and reference where reference can be a tag or digest. A HEAD request can also be issued to this endpoint to obtain resource information without receiving all data.
	// PUT	/v2/<name>/manifests/<reference>	Manifest	Put the manifest identified by name and reference where reference can be a tag or digest.
	// DELETE	/v2/<name>/manifests/<reference>	Manifest	Delete the manifest or tag identified by name and reference where reference can be a tag or digest. Note that a manifest can only be deleted by digest.
	// GET	/v2/<name>/blobs/<digest>	Blob	Retrieve the blob from the registry identified by digest. A HEAD request can also be issued to this endpoint to obtain resource information without receiving all data.
	// DELETE	/v2/<name>/blobs/<digest>	Blob	Delete the blob identified by name and digest
	// POST	/v2/<name>/blobs/uploads/	Initiate Blob Upload	Initiate a resumable blob upload. If successful, an upload location will be provided to complete the upload. Optionally, if the digest parameter is present, the request body will be used to complete the upload in a single request.
	// GET	/v2/<name>/blobs/uploads/<uuid>	Blob Upload	Retrieve status of upload identified by uuid. The primary purpose of this endpoint is to resolve the current status of a resumable upload.
	// PATCH	/v2/<name>/blobs/uploads/<uuid>	Blob Upload	Upload a chunk of data for the specified upload.
	// PUT	/v2/<name>/blobs/uploads/<uuid>	Blob Upload	Complete the upload specified by uuid, optionally appending the body as the final chunk.
	// DELETE	/v2/<name>/blobs/uploads/<uuid>	Blob Upload	Cancel outstanding upload processes, releasing associated resources. If this is not called, the unfinished uploads will eventually timeout.
	// GET	/v2/_catalog	Catalog	Retrieve a sorted, json list of repositories available in the registry.
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('Check that the endpoint implements Docker Registry API V2.', async () => {
		const resp = await worker.fetch('/v2/');
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Fetch the tags under the repository identified by name.', async () => {
		const resp = await worker.fetch(
			'/v2/maximoguk.com/cool-new-project/tags/list'
		);
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Tags list`);
		}
	});

	it('Fetch the manifest identified by name and reference where reference can be a tag or digest.', async () => {
		const resp = await worker.fetch(
			'/v2/maximoguk.com/cool-new-project/manifests/cool-new-project'
		);
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Put the manifest identified by name and reference where reference can be a tag or digest.', async () => {
		const resp = await worker.fetch(
			'/v2/maximoguk.com/cool-new-project/manifests/cool-new-project',
			{ method: 'PUT' }
		);
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Delete the manifest or tag identified by name and reference where reference can be a tag or digest.', async () => {
		const resp = await worker.fetch(
			'/v2/maximoguk.com/cool-new-project/manifests/cool-new-project',
			{ method: 'DELETE' }
		);
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Retrieve the blob from the registry identified by digest.', async () => {
		const resp = await worker.fetch('/v2/cool-new-project/blobs/123456789');
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Delete the blob identified by name and digest', async () => {
		const resp = await worker.fetch('/v2/cool-new-project/blobs/123456789', {
			method: 'DELETE',
		});
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Initiate Blob Upload', async () => {
		const resp = await worker.fetch('/v2/<name>/blobs/uploads/', {
			method: 'POST',
		});
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Blob Upload	Retrieve status of upload identified by uuid.', async () => {
		const resp = await worker.fetch('/v2/<name>/blobs/uploads/<uuid>');
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Blob Upload	Upload a chunk of data for the specified upload.', async () => {
		const resp = await worker.fetch('/v2/<name>/blobs/uploads/<uuid>', {
			method: 'PATCH',
		});
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Blob Upload	Complete the upload specified by uuid', async () => {
		const resp = await worker.fetch('/v2/<name>/blobs/uploads/<uuid>', {
			method: 'PUT',
		});
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Blob Upload	Cancel outstanding upload processes', async () => {
		const resp = await worker.fetch('/v2/<name>/blobs/uploads/<uuid>', {
			method: 'DELETE',
		});
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});

	it('Catalog	Retrieve a sorted, json list of repositories available in the registry.', async () => {
		const resp = await worker.fetch('/v2/_catalog');
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"V2 API"`);
		}
	});
});
