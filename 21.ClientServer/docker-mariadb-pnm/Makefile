.PHONY: run
run:
	docker run -d -p 3307:3306 -e MYSQL_ROOT_PASSWORD=password \
		-v `pwd`/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d \
		-v `pwd`/bulkdata:/bulkdata \
		-v `pwd`/my.utf8.cnf:/etc/mysql/my.cnf \
		-v /etc/localtime:/etc/localtime:ro \
		--rm --name mariadb-pnm mariadb:10.2 || :

.PHONY: exec
exec:
	docker exec -it mariadb-pnm /bin/bash

.PHONY: stop
stop:
	docker stop mariadb-pnm || :

.PHONY: logs
logs:
	docker logs -f mariadb-pnm || :
