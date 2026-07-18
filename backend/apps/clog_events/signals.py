# The SensorReading post_save receiver that used to live here has been
# consolidated into apps/sensor_readings/signals.py to eliminate a
# duplicate-receiver bug (both files were firing the same alert/clog
# logic on every reading). See that file for the current logic.