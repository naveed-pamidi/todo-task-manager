from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase


class TaskAPITests(APITestCase):
    url = '/api/tasks/'

    def make(self, **fields):
        data = {'title': 'Task'}
        data.update(fields)
        return self.client.post(self.url, data, format='json')

    def test_create_and_list(self):
        r = self.make(title='Buy milk', priority='High')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()['status'], 'Pending')
        self.assertEqual(len(self.client.get(self.url).json()), 1)

    def test_empty_title_rejected(self):
        for bad in ['', '   ']:
            r = self.make(title=bad)
            self.assertEqual(r.status_code, 400)
            self.assertIn('title', r.json())

    def test_update_with_put(self):
        t = self.make(title='Old').json()
        payload = {'title': 'New', 'description': 'd', 'deadline': None,
                   'priority': 'Low', 'status': 'Pending'}
        r = self.client.put(f'{self.url}{t["id"]}/', payload, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['title'], 'New')

    def test_patch_status(self):
        t = self.make().json()
        r = self.client.patch(f'{self.url}{t["id"]}/', {'status': 'Completed'}, format='json')
        self.assertEqual(r.json()['status'], 'Completed')

    def test_delete(self):
        t = self.make().json()
        self.assertEqual(self.client.delete(f'{self.url}{t["id"]}/').status_code, 204)
        self.assertEqual(self.client.get(self.url).json(), [])

    def test_filters(self):
        self.make(title='Alpha', priority='High')
        done = self.make(title='Beta', priority='Low').json()
        self.client.patch(f'{self.url}{done["id"]}/', {'status': 'Completed'}, format='json')

        self.assertEqual(len(self.client.get(self.url, {'status': 'Completed'}).json()), 1)
        self.assertEqual(len(self.client.get(self.url, {'priority': 'High'}).json()), 1)
        self.assertEqual(len(self.client.get(self.url, {'search': 'alp'}).json()), 1)

    def test_overdue(self):
        yesterday = (timezone.localdate() - timedelta(days=1)).isoformat()
        self.make(title='Late', deadline=yesterday)
        self.make(title='Done late', deadline=yesterday, status='Completed')
        self.make(title='No date')

        rows = self.client.get(self.url, {'overdue': 'true'}).json()
        self.assertEqual([r['title'] for r in rows], ['Late'])
        self.assertTrue(rows[0]['is_overdue'])