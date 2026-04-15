CREATE TABLE `classroom_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`is_active` int NOT NULL DEFAULT 0,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classroom_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`student_id` varchar(255) NOT NULL,
	`student_name` varchar(255) NOT NULL,
	`check_in_time` timestamp NOT NULL DEFAULT (now()),
	`check_out_time` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `temperature_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`current_temperature` decimal(5,2) NOT NULL,
	`target_temperature` decimal(5,2) NOT NULL,
	`student_count` int NOT NULL,
	`comfort_status` varchar(50) NOT NULL,
	`season` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `temperature_logs_id` PRIMARY KEY(`id`)
);
