"""
Kịch bản (script) chính dùng để huấn luyện mô hình.
"""

import argparse
from architecture import AIAssistantModel

def train(config_path):
    print(f"Bắt đầu quá trình huấn luyện với cấu hình từ: {config_path}")
    model = AIAssistantModel()
    
    # TODO: Load data, setup optimizer, loss function và vòng lặp huấn luyện (training loop)
    print("Huấn luyện hoàn tất!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Huấn luyện mô hình trợ lý AI")
    parser.add_argument("--config", type=str, default="../../config/train_config.yaml", help="Đường dẫn đến file cấu hình huấn luyện")
    args = parser.parse_args()
    
    train(args.config)
