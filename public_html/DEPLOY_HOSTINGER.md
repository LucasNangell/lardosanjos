# Deploy Hostinger — referência rápida

Este diretório é **opcional**. Os apps principais rodam como **Node.js Web Apps** no hPanel, não como arquivos estáticos em `public_html`.

## Arquivos aqui

| Arquivo | Uso |
|---------|-----|
| `schema.sql` | Cópia de `deploy/schema.sql` para download/importação via File Manager |
| `DEPLOY_HOSTINGER.md` | Este guia |

## Importar banco

1. hPanel → phpMyAdmin.
2. Selecione o banco vazio.
3. Importe `schema.sql`.

Documentação completa: [README_DEPLOY_HOSTINGER_GITHUB.md](../README_DEPLOY_HOSTINGER_GITHUB.md)
