-- Add session_code column to classroom_sessions
ALTER TABLE `classroom_sessions` 
ADD COLUMN `session_code` varchar(64) UNIQUE;

-- Add session_code column to student_attendance
ALTER TABLE `student_attendance` 
ADD COLUMN `session_code` varchar(64);

-- Add session_code column to temperature_logs
ALTER TABLE `temperature_logs` 
ADD COLUMN `session_code` varchar(64);

-- Update existing records with default session codes if needed
UPDATE `classroom_sessions` 
SET `session_code` = CONCAT('SESSION-', `id`) 
WHERE `session_code` IS NULL;

-- Make session_code NOT NULL after populating
ALTER TABLE `classroom_sessions` 
MODIFY COLUMN `session_code` varchar(64) NOT NULL;

-- Create index on session_code for faster lookups
CREATE INDEX `idx_classroom_sessions_session_code` ON `classroom_sessions`(`session_code`);
CREATE INDEX `idx_student_attendance_session_code` ON `student_attendance`(`session_code`);
CREATE INDEX `idx_temperature_logs_session_code` ON `temperature_logs`(`session_code`);
