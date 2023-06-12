# docker-registry-cf

To start registry via `wrangler dev --remote`

Create a `.dev.vars` file in project root directory for local dev

Set `USER=USERNAME` & `PASS=PASS`

If `PROD=false` in `.dev.vars` it will disable authentication

Make sure to set up an r2 preview/prod binding in the `wrangler.toml` and dash https://github.com/Maximo-Guk/docker-registry-cf/blob/main/wrangler.toml#L8

Then one can simply use `docker login registryexample.workers.dev` to authenticate and to start pushing and pulling images.

# Deploying Worker

Run `wrangler deploy`

Remember to publish secrets for production worker through `wrangler secret put USER` & `wrangler secret put PASS` and set `wrangler secret put PROD` to true.

You should also probably configure a domain/route for the worker as you normally would, or just use the `workers.dev` domain provided. https://github.com/Maximo-Guk/docker-registry-cf/blob/main/wrangler.toml#L3

# Supported Things

Currently only things supported are `pushing` and `pulling` images through auth, everything else isn't supported from https://docs.docker.com/registry/spec/api/

TODO:
Delete manifests/images<br>
List catalog<br>
Write tests to ensure OCI compliance<br>
..and much more

# There's also a Dockerfile/docker-compose.yaml in this directory

The reasoning for this is because when developping locally and having docker push to a local registry it doesn't seem to work unless the registry
is running in a container, might be due to some `network_mode` setting or something.

You would also need to add it as a insecure registry https://docs.docker.com/registry/insecure/ when testing locally.

If developing through this route, make sure to set `CLOUDFLARE_ACCOUNT_ID` & `CLOUDFLARE_API_TOKEN` environment variables in `docker-compose.override.yaml`
Can also bind     `volumes:
      - ./src/:/usr/src/app/src/:ro`
to have wrangler watch for changes.
