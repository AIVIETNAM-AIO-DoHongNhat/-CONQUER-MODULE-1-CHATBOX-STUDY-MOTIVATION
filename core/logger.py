import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

def log_error(message: str, status_code: int):
    logger.error(f"{message} - Status Code: {status_code}")

def log_warning(message: str):
    logger.warning(message)

def log_info(message: str):
    logger.info(message)

def log_debug(message: str):
    logger.debug(message)
