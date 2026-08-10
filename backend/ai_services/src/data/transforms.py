"""
FreshFlow OS - Image transforms.

Train transform includes augmentation; val/test transforms are
deterministic (resize + normalize only) so evaluation numbers are stable
and comparable across runs. This split is also part of leakage prevention:
augmentation must never leak into how val/test images are scored.
"""
from torchvision import transforms

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_train_transform(cfg: dict):
    img_size = cfg["data"]["image_size"]
    aug = cfg["augmentation"]
    cj = aug["color_jitter"]

    return transforms.Compose([
        transforms.RandomResizedCrop(
            img_size, scale=tuple(aug["random_resized_crop_scale"])
        ),
        transforms.RandomHorizontalFlip() if aug["horizontal_flip"] else transforms.Lambda(lambda x: x),
        transforms.RandomRotation(aug["rotation_degrees"]),
        transforms.ColorJitter(
            brightness=cj["brightness"], contrast=cj["contrast"],
            saturation=cj["saturation"], hue=cj["hue"],
        ),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_eval_transform(cfg: dict):
    img_size = cfg["data"]["image_size"]
    return transforms.Compose([
        transforms.Resize(int(img_size * 1.14)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
