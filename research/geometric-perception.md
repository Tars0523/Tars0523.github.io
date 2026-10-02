---
layout: research-detail
title: Geometric Perception
permalink: /research/geometric-perception/
number: '01'
description: Safe and scalable 3D perception across sensing modalities.
image: /assets/img/covers/geometry.png
image_alt: A sampled three-dimensional surface represented as a point cloud
caption: 'Conceptual illustration: a sampled 3D surface, colored by height. Not an experimental result.'
next_url: /research/deep-learning/
next_title: Deep Learning
---
## Seeing structure beyond the sensor

I am interested in building safe and scalable 3D geometric perception systems for robotics. A central question is how different geometric perception algorithms can operate in a sensor-agnostic manner, enabling robust performance across heterogeneous sensing modalities.

Sensors describe the world in different ways. My interest lies in the geometric structure behind those observations: how it can be represented, related across measurements, and used reliably by a robot.

## Questions I want to explore

- What geometric information can be shared across different sensing modalities?
- How can a perception system remain reliable when measurements are noisy or incomplete?
- How can geometric reasoning scale while retaining the structure needed for robust estimation?

## From perception to robust estimation

Reliable geometry also depends on how we handle observations that do not agree. My [Graduated Non-Convexity notes]({{ '/posts/GNC/' | relative_url }}) examine this connection through robust estimation and optimization.
