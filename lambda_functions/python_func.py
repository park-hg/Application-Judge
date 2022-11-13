import json
import sys
from io import StringIO

inputs = json.load(open('./inputs.txt'))

def lambda_handler(event, context):

    payload = json.loads(event.get("body"), strict=False)

    print(inputs[payload["problemId"]])  
    args = iter(inputs[payload['problemId']])
    print(args)
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
          exec(payload['code'])
    except StopIteration:
        pass
    finally:
        del args
    
    sys.stdout = old_stdout
    print(new_stdout.getvalue().split())

    return {
        'statusCode': 200,
        'body': json.dumps(new_stdout.getvalue().split())
    }
