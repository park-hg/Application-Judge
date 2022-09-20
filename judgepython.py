import sys
import json
from io import StringIO

inputs = json.load(open('./inputs.txt'))

event = {
  "body": '{"gitId":"park-hg","problemId":"62c973cd465933160b9499c1","lang":"Python","code":"import sys\n\na, b = map(int, sys.stdin.readline().split())\nprint(a+b)"}'
}

payload = json.loads(event["body"], strict=False)

print(inputs[payload["problemId"]])
args = iter(inputs[payload["problemId"]])
def get_input():
  return next(args)

input = get_input
sys.stdin.readline = get_input

new_stdout = StringIO()
old_stdout = sys.stdout
old_stderr = sys.stderr

sys.stdout = new_stdout

try:
    while True:
      exec(payload["code"])
except StopIteration:
    pass
finally:
    del args

sys.stdout = old_stdout
print(new_stdout.getvalue().split())
