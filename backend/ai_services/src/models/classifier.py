"""
TAZA AI Service - Model architecture.

Default: MobileNetV3-Large (torchvision, ImageNet-pretrained).
Rationale for the hackathon MVP:
  - ~5.4M params, runs comfortably on CPU for inference (important since
    the FastAPI service may not have GPU in a hackathon deployment).
  - Strong accuracy/latency tradeoff vs ResNet50, competitive with
    EfficientNet-B0 on small fine-tuning datasets.
  - torchvision ships pretrained weights with no extra download wrangling.

EfficientNet-B0 is offered as a drop-in alternative (slightly higher
accuracy ceiling, slightly heavier) if accuracy is prioritized over
inference latency once you have real timing numbers.
"""
import torch
import torch.nn as nn
from torchvision import models


def build_model(architecture: str, num_classes: int, pretrained: bool = True, dropout: float = 0.3) -> nn.Module:
    architecture = architecture.lower()

    if architecture == "mobilenet_v3_large":
        weights = models.MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
        model = models.mobilenet_v3_large(weights=weights)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes),
        )
        backbone_params = list(model.features.parameters())

    elif architecture == "mobilenet_v2":
        weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
        model = models.mobilenet_v2(weights=weights)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes),
        )
        backbone_params = list(model.features.parameters())

    elif architecture == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes),
        )
        backbone_params = list(model.features.parameters())

    else:
        raise ValueError(f"Unsupported architecture: {architecture}")

    model._backbone_params = backbone_params  # stashed for freeze/unfreeze control
    return model


def freeze_backbone(model: nn.Module):
    for p in model._backbone_params:
        p.requires_grad = False


def unfreeze_backbone(model: nn.Module):
    for p in model._backbone_params:
        p.requires_grad = True


def count_trainable_params(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
