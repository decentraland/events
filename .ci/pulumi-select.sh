if pulumi stack --cwd .ci select $1 then
  echo "[stack $stack] Stack exists ✅";
else
  pulumi stack --cwd .ci init $1
  echo "[stack $stack] Stack created ✅";
fi