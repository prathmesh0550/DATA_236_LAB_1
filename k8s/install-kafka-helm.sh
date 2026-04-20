#!/usr/bin/env bash
set -euo pipefail
NS=${1:-yelp-lab2}

kubectl get namespace "$NS" >/dev/null 2>&1 || kubectl create namespace "$NS"

helm upgrade --install kafka oci://registry-1.docker.io/bitnamicharts/kafka \
  --namespace "$NS" \
  --set replicaCount=1 \
  --set controller.replicaCount=1 \
  --set listeners.client.protocol=PLAINTEXT \
  --wait

kubectl get svc -n "$NS" -l app.kubernetes.io/name=kafka