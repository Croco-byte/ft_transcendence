# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: llefranc <llefranc@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2021/08/16 12:30:03 by lucaslefran       #+#    #+#              #
#    Updated: 2021/09/28 15:00:06 by qroland          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		=	ft_transcendence

# Build all images, create volumes and network, and run the containers.
install		:
				docker-compose -f docker-compose.yml up --force-recreate --build --no-start
				docker-compose -f docker-compose.yml start
				docker-compose logs -f back front postgres

# Stop all the containers, remove them, and also remove the network / the images / the volumes. 
remove		:
				docker-compose -f docker-compose.yml down -v --rmi all
				
# Rebuild all the images and run the containers with new volumes / new network.
reinstall	:	remove install

# Rebuild front image and run the containers with new volumes / new network.
reinstall_front	:
				docker-compose -f docker-compose.yml down -v
				docker image build --no-cache ./front/
				docker-compose -f docker-compose.yml up --no-start
				docker-compose -f docker-compose.yml start
				docker-compose logs -f back front postgres

# Rebuild back image and run the containers with new volumes / new network.
reinstall_back	:
				docker-compose -f docker-compose.yml down -v
				docker image build --no-cache ./back/
				docker-compose -f docker-compose.yml up --no-start
				docker-compose -f docker-compose.yml start
				docker-compose logs -f back front postgres
				
# Run all the containers, using previous data stored in volumes and on host machine for 
# app files. 'make install' need to have been executed before.
start		: 	$(NAME)

$(NAME)		:
				docker-compose -f docker-compose.yml start
				docker-compose logs -f back front postgres

# Stop all the containers. Data is saved in volumes. Use 'make start' if you want to relaunch the
# containers.
stop		:	
				docker-compose -f docker-compose.yml stop 

# Stop all the containers and removed them with their volumes, then run them again with new volumes.
# Doesn't rebuild images, use this command if you just want to restart the project with a clean DB.
recreate	:
				docker-compose -f docker-compose.yml down -v
				docker-compose -f docker-compose.yml up --no-start
				docker-compose -f docker-compose.yml start
				docker-compose logs -f back front postgres

test		:
				docker-compose -f docker-compose.yml start
				docker-compose exec postgres "/db_test_scripts/test_setup.sh"
				docker-compose logs -f back front postgres
				

.PHONY		:	run resintall install stop remove
