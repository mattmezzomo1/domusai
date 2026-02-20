-- Add whatsapp_message_template column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN whatsapp_message_template TEXT DEFAULT 'Olá {nome}! Tudo bem?' AFTER operating_hours;

