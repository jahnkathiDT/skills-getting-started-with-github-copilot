from src.app import activities


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_all_seeded_activities(client):
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == len(activities)
    assert "Chess Club" in data
    assert "Soccer Team" in data
    assert data["Math Olympiad"]["participants"] == ["grace@mergington.edu", "jack@mergington.edu"]


def test_signup_adds_new_participant(client):
    email = "new.student@mergington.edu"

    response = client.post("/activities/Chess%20Club/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert email in activities["Chess Club"]["participants"]


def test_signup_rejects_unknown_activity(client):
    response = client.post("/activities/Unknown%20Club/signup", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_rejects_duplicate_participant(client):
    existing_email = activities["Chess Club"]["participants"][0]
    before = list(activities["Chess Club"]["participants"])

    response = client.post("/activities/Chess%20Club/signup", params={"email": existing_email})

    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}
    assert activities["Chess Club"]["participants"] == before


def test_unregister_removes_existing_participant(client):
    email = activities["Programming Class"]["participants"][0]

    response = client.delete("/activities/Programming%20Class/participants", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from Programming Class"}
    assert email not in activities["Programming Class"]["participants"]


def test_unregister_rejects_unknown_activity(client):
    response = client.delete("/activities/Unknown%20Club/participants", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_rejects_student_not_enrolled(client):
    before = list(activities["Debate Society"]["participants"])

    response = client.delete(
        "/activities/Debate%20Society/participants",
        params={"email": "absent.student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up for this activity"}
    assert activities["Debate Society"]["participants"] == before


def test_signup_then_unregister_flow_is_isolated(client):
    email = "flow.student@mergington.edu"

    signup_response = client.post("/activities/Art%20Studio/signup", params={"email": email})
    assert signup_response.status_code == 200
    assert email in activities["Art Studio"]["participants"]

    unregister_response = client.delete("/activities/Art%20Studio/participants", params={"email": email})
    assert unregister_response.status_code == 200
    assert email not in activities["Art Studio"]["participants"]