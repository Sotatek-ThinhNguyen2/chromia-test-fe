deploy_dev_user:
	rsync -avhzL --delete \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--exclude .env \
				--exclude dist \
				--exclude tmp \
				--exclude node_modules \
				--exclude workers \
				--exclude .env.local \
				. sotatek@10.4.40.156:/home/sotatek/Desktop/chromia-user

deploy_dev_53:
	rsync -avhzL --delete \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--exclude .env \
				--exclude dist \
        --exclude docker-compose.yml \
				--exclude tmp \
				--exclude node_modules \
				--exclude workers \
				--filter=":- .gitignore" \
				. sotatek@10.2.15.53:/var/www/votee-lending-dev/votee-lending-backend-dev
	ssh sotatek@10.2.15.53 "pm2 restart VOTEE-LENDING-BE-DEV"