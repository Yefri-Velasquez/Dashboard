FROM nginx:alpine
 
# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf
 
# Copy dashboard and config
COPY index.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/dashboard.conf
 
# Fix permissions
RUN chmod 644 /usr/share/nginx/html/index.html
 
EXPOSE 3000
 
CMD ["nginx", "-g", "daemon off;"]