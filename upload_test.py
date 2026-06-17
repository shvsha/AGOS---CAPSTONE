import requests

url = 'http://localhost:8000/api/report-media/upload/'
headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgxNjgxNzgzLCJpYXQiOjE3ODE2Nzk5ODMsImp0aSI6IjI4MGYzNzc3NDUxMTQ3NmZhYjQzYTZmZjdjZDQ4YTE1IiwidXNlcl9pZCI6IjEifQ.mQ2Si5pg4rAJFLrymWj9SNPCRjDmNhLt1DvDgmRKbJk'}

uploads = [
    {
        'path': r'C:\Users\admin\Desktop\Capstone-garbageee\Biodegradable\20260603_164521.jpg',
        'media_category': 'Before_Clearing',
    },
    {
        'path': r'C:\Users\admin\Desktop\Capstone-garbageee\Biodegradable\20260603_164759.jpg',
        'media_category': 'After_Clearing',
    },
]

for item in uploads:
    files = {'file': open(item['path'], 'rb')}
    data = {
        'media_type': 'Image',
        'media_category': item['media_category'],
        'clog_event_id': '14',
    }
    res = requests.post(url, headers=headers, files=files, data=data)
    print(item['media_category'], '->', res.status_code)
    print(res.json())
    print('---')