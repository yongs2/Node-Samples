.PHONY: build
build:
	docker build -t node-msg-httpd -f Dockerfile .

.PHONY: run
run:
	docker run \
		-e "NODE_ENV=production" \
		-m "300M" --memory-swap "1G" \
		-e "REDIS_URL=redis://@192.168.0.100:6379/0" \
		-e "REDIS_AUTH_NAME=CLI#" \
		-e "JWT_ISS=node-msg-httpd" \
		-e "JWT_SECRET=JAPIJWTKEY" \
		-p 3000:3000 \
		-p 3443:3443 \
		-d --rm --name node-msg-httpd node-msg-httpd || :

.PHONY: exec
exec:
	docker exec -it node-msg-httpd /bin/bash

.PHONY: stop
stop:
	docker stop node-msg-httpd || :

.PHONY: logs
logs:
	docker logs -f node-msg-httpd || :
