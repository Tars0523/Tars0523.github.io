---
layout: research-detail
title: Uncertainty Quantification
permalink: /research/uncertainty/
number: '03'
description: Understanding the reliability of a robot’s geometric estimates.
image: /assets/img/covers/uncertainty.png
image_alt: Nested confidence ellipses surrounding a noisy two-dimensional estimate
caption: 'Conceptual illustration: synthetic observations and covariance ellipses. Not an experimental result.'
next_url: /research/geometric-perception/
next_title: Geometric Perception
---
## Beyond a single estimate

A perception system produces an estimate of the world from imperfect observations. I am interested in understanding the uncertainty associated with that estimate as part of building safe and scalable robotic perception.

This interest connects naturally to sensor-agnostic perception: different sensing modalities provide different information, and their limitations need to be considered when reasoning about geometry.

## Questions I want to explore

- How can uncertainty be represented meaningfully in 3D geometric perception?
- How should a system account for differences in the reliability of its observations?
- How can uncertainty inform the interpretation of a perception result?

## A connection to robust estimation

Uncertainty and outlier robustness address related questions about the trust we place in measurements. My [GNC series]({{ '/posts/GNC/' | relative_url }}) records my study of robust costs, measurement weights, and continuation methods.
