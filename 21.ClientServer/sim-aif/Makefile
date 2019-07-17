.PHONY: build
build:
	docker build -t sim-aif -f Dockerfile .

.PHONY: run
run:
	docker run \
		-m "300M" --memory-swap "1G" \
		-p 4000:4000 \
		-p 4443:4443 \
		-d --rm --name sim-aif sim-aif || :

.PHONY: exec
exec:
	docker exec -it sim-aif /bin/bash

.PHONY: stop
stop:
	docker stop sim-aif || :

.PHONY: logs
logs:
	docker logs -f sim-aif || :
