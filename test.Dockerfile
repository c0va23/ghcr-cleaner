FROM alpine:3.16

ARG VALUE

RUN echo ${VALUE} > .tmp
