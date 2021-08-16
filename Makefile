# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lucaslefrancq <lucaslefrancq@student.42    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2021/08/16 12:30:03 by lucaslefran       #+#    #+#              #
#    Updated: 2021/08/16 12:50:20 by lucaslefran      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		=	ft_transcendence

# Build all images, create volumes and network, and run the containers.
install		:
				docker-compose -f docker-compose.yml up --force-recreate --build

# Run all the containers, using previous data stored in volumes and on host machine for 
# app files. 'make install' need to have been executed before.
start		: 	$(NAME)

$(NAME)		:
				docker-compose -f docker-compose.yml start
				docker-compose logs -f

# Stop all the containers. Data is saved in volumes. Use 'make start' if you want to relaunch the
# containers.
stop		:	
				docker-compose -f docker-compose.yml stop 

# Stop all the containers, remove them, and also remove the network / the images / the volumes. 
remove		:
				docker-compose -f docker-compose.yml down -v --rmi all

# Rebuild all the images and run the containers with new volumes.
reinstall	:	remove install

.PHONY		:	run resintall install stop remove