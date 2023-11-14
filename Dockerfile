FROM registry.cn-hangzhou.aliyuncs.com/node_b_system/be.node:16.10.0

RUN mkdir -p /app

WORKDIR /app

COPY . /app

EXPOSE 8080

CMD yarn start
