# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: llefranc <llefranc@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2021/08/16 12:30:03 by lucaslefran       #+#    #+#              #
#    Updated: 2021/09/29 12:45:54 by llefranc         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		=	ft_transcendence

# Build all images, create volumes and network, and run the containers.
install		:
				cd .. && docker-compose -f docker-compose.yml up --force-recreate --build --no-start
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose logs -f back front postgres

# Stop all the containers, remove them, and also remove the network / the images / the volumes. 
remove		:
				cd .. && docker-compose -f docker-compose.yml down -v --rmi all
				
# Rebuild all the images and run the containers with new volumes / new network.
reinstall	:	remove install

# Rebuild front image and run the containers with new volumes / new network.
reinstall_front	:
				cd .. && docker-compose -f docker-compose.yml down -v
				cd .. && docker image build --no-cache ./srcs/front/
				cd .. && docker-compose -f docker-compose.yml up --no-start
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose logs -f back front postgres

# Rebuild back image and run the containers with new volumes / new network.
reinstall_back	:
				cd .. && docker-compose -f docker-compose.yml down -v
				cd .. && docker image build --no-cache ./srcs/back/
				cd .. && docker-compose -f docker-compose.yml up --no-start
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose logs -f back front postgres
				
# Run all the containers, using previous data stored in volumes and on host machine for 
# app files. 'make install' need to have been executed before.
start		: 	$(NAME)

$(NAME)		:
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose logs -f back front postgres

# Stop all the containers. Data is saved in volumes. Use 'make start' if you want to relaunch the
# containers.
stop		:	
				cd .. && docker-compose -f docker-compose.yml stop 

# Stop all the containers and removed them with their volumes, then run them again with new volumes.
# Doesn't rebuild images, use this command if you just want to restart the project with a clean DB.
recreate	:
				cd .. && docker-compose -f docker-compose.yml down -v
				cd .. && docker-compose -f docker-compose.yml up --no-start
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose logs -f back front postgres

test		:
				cd .. && docker-compose -f docker-compose.yml start
				cd .. && docker-compose exec postgres "/srcs/db_test_scripts/test_setup.sh"
				cd .. && docker-compose logs -f back front postgres
				

.PHONY		:	run resintall install stop remove
