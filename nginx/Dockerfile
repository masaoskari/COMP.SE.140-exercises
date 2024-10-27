FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY .htpasswd /etc/nginx/.htpasswd 

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]