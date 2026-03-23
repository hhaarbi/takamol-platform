CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`leadId` int,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`phone` varchar(30),
	`email` varchar(320),
	`serviceType` enum('buy','sell','rent_looking','rent_listing','property_management','unknown') DEFAULT 'unknown',
	`budget` varchar(100),
	`preferredCity` varchar(100),
	`notes` text,
	`status` enum('new','contacted','qualified','closed','lost') NOT NULL DEFAULT 'new',
	`source` enum('chat','form','phone','referral') NOT NULL DEFAULT 'chat',
	`sessionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`description` text,
	`descriptionAr` text,
	`type` enum('apartment','villa','land','commercial','office','warehouse') NOT NULL,
	`listingType` enum('sale','rent') NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`priceUnit` enum('total','per_month','per_year') NOT NULL DEFAULT 'total',
	`area` decimal(10,2),
	`bedrooms` int,
	`bathrooms` int,
	`floor` int,
	`totalFloors` int,
	`city` varchar(100),
	`district` varchar(100),
	`address` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`images` json DEFAULT ('[]'),
	`features` json DEFAULT ('[]'),
	`featuresAr` json DEFAULT ('[]'),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`negotiable` boolean NOT NULL DEFAULT true,
	`minPrice` decimal(15,2),
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
