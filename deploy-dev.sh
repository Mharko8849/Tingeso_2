#!/bin/bash
set -e # Detener el script si hay errores

echo "=========================================="
echo "   INICIANDO DESPLIEGUE DE DESARROLLO"
echo "=========================================="

# 1. Docker Login
echo "[1/5] Iniciando sesión en Docker Hub..."
docker login
# El comando anterior espera automáticamente a que termines el login.

# 2. Iniciar Minikube
echo "[2/5] Iniciando Minikube con driver KVM2..."
minikube start --driver=kvm2

echo "Verificando que el nodo esté listo..."
# Espera activa hasta que el nodo reporte estado Ready
kubectl wait --for=condition=Ready node --all --timeout=120s

# 3. Obtener IP
MINIKUBE_IP=$(minikube ip)
echo "[3/5] La IP de Minikube es: $MINIKUBE_IP"

# 4. Ejecutar Skaffold
echo "[4/5] Ejecutando Skaffold (Perfil Desarrollo)..."
# Skaffold run espera a que los deployments estén estables por defecto
skaffold dev -v debug 

# 5. Esperar a que el Frontend responda (Wait real)
TARGET_URL="http://$MINIKUBE_IP:31111"
echo "[5/5] Esperando a que el frontend esté disponible en: $TARGET_URL"

# Bucle de espera activa: Intenta conectar cada 2 segundos hasta que responda HTTP 200
MAX_RETRIES=60 # 2 minutos max
COUNT=0
echo "Sondeando URL..."

until curl --output /dev/null --silent --head --fail "$TARGET_URL"; do
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Error: Tiempo de espera agotado. El frontend no responde."
        exit 1
    fi
    printf '.'
    sleep 2
    COUNT=$((COUNT+1))
done

echo ""
echo "¡Servicio Frontend Activo!"

# Abrir Navegador
if which xdg-open > /dev/null; then
  xdg-open "$TARGET_URL"
else
  python3 -m webbrowser "$TARGET_URL"
fi

echo "=========================================="
echo "       DESPLIEGUE COMPLETADO"
echo "=========================================="
