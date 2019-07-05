FROM yongs2/node-dev:10.16.0-stretch

LABEL Maintainer="yongs2@j-din.com"

USER root
ARG APP_DIR=/app

# Upload 디렉토리 설정
ENV DIRECTORY_UPLOAD ${APP_DIR}/public

# WORKDIR 로 설정
WORKDIR ${APP_DIR}

# 디렉토리 생성 및 소스 복사
ADD ./ ${APP_DIR}
RUN cd ${APP_DIR}/config \
    && chmod +x *.sh \
    && ./generate_crt.sh \
    && cd ${APP_DIR} \
    && npm install \
    && npm audit fix 

#가상 머신에 오픈할 포트
EXPOSE 3000 3443

#컨테이너에서 실행될 명령을 지정
CMD ["npm", "start"]
