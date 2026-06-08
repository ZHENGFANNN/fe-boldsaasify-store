#!/bin/zsh
cd /Users/zhengfan/Desktop/BoldRadiant/fe-boldradient
rm -rf .next .open-next
env -u __NEXT_PRIVATE_STANDALONE_CONFIG -u __NEXT_PRIVATE_ORIGIN NODE_ENV=production npx opennextjs-cloudflare build > /tmp/on-mw.log 2>&1
echo "EXIT=$?" >> /tmp/on-mw.log
