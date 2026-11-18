# Test tooling only; no AWS credentials, Docker socket or host /opt mount.
FROM python:3.13-slim-bookworm@sha256:a5a7017efc5969e00ae2b91c8eb0631049a569652aa4ffc4501769049ae45c72
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash jq util-linux coreutils \
    && rm -rf /var/lib/apt/lists/*
ENV RIGFORCE_TEST_CONTAINER=1
CMD ["bash", "-c", "python3 /repo/infra/tests/deploy/parser_fixtures.py && python3 /repo/infra/tests/deploy/integration.py"]
