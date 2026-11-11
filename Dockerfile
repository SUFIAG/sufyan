FROM nginx:1.27-alpine

# Replace the default site with ours
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/site.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY public/ /usr/share/nginx/html/

EXPOSE 8080
