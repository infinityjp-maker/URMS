# 自宅

> **resource_type:** location  
> **resource_id:** location:home  
> **latitude:** 35.6762  
> **longitude:** 139.6503  
> **timezone:** Asia/Tokyo  
> **primary:** true  

地点コンテキスト名は `# 自宅`（勤務先など複数地点は別ファイル · `primary` で切替）。  
天気カードの **地名** は GPS または座標から API が自動解決（`place_name` で上書き可）。

```markdown
**place_name:** 東京都渋谷区
```

- ブラウザ位置情報が取れた場合 → その座標の地名を表示  
- 未取得時 → 上記 latitude/longitude から地名を解決
